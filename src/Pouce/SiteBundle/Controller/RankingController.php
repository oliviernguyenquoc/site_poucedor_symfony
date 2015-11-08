<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Pouce\TeamBundle\Entity\TeamRepository;
use Pouce\SiteBundle\Entity\EditionRepository;
use Pouce\UserBundle\Entity\UserRepository;

class RankingController extends Controller
{
    public function rankingAction($idEdition)
    {
        $repository = $this ->getDoctrine() 
                            ->getManager()
                            ->getRepository('PouceTeamBundle:Result');

        $results = $repository->getAllResultsInEdition((int)$idEdition);

        self::rankingCalculus($results);
        
        return $this->render('PouceSiteBundle:Site:ranking.html.twig', array(
          'results' => $results,
        ));
    }

    public function rankingByYearAction($year)
    {
        $repository = $this ->getDoctrine() 
                            ->getManager()
                            ->getRepository('PouceTeamBundle:Result');

        $results = $repository->getAllResultsByYear((int)$year);

        self::rankingCalculus($results);

        $resultsSchool=self::rankingBySchool($results);
        
        return $this->render('PouceSiteBundle:Site:ranking.html.twig', array(
          'results' => $results,
          'resultsSchool' => $resultsSchool
        ));
    }

    //Recalcule toutes les rangs et stock les nouvelles valeurs dans la base de données 
    private function rankingCalculus($results){
        $rang=0;
        $rangAdd=0;
        $ancienneDistance=0;

        $em = $this->getDoctrine()->getManager();

        foreach($results as $result)
        {
            if($result->getPosition()->getDistance()!=$ancienneDistance)
            {
                $rang+=1;
                $rang+=$rangAdd;
                $rangAdd=0;
            }
            else
            {
                $rangAdd+=1;
            }
            $result->setRank($rang);
            $em ->persist($result);
            $ancienneDistance=$result->getPosition()->getDistance();
        }

        $em->flush();

    }

    private function rankingBySchool($results)
    {
        $resultsSchool[0][0] = [];
        $resultsSchool[0][1] = [];
        $resultsSchool[1] = [];

        $repository = $this ->getDoctrine() 
                            ->getManager()
                            ->getRepository('PouceUserBundle:User');

        foreach($results as $result)
        {
            $team = $result->getTeam();
            $school = $repository->findAUserOfTeam($team)->getSchool();
            if(!in_array($school->getId(), $resultsSchool[0][0],TRUE))
            {
                $resultsSchool[0][0][] = $school->getId();
                $resultsSchool[0][1][] = $school;
            }
            $i = array_search($school->getId(),$resultsSchool[0][0]);
            $resultsSchool[1][$i][] = $result;
        }

        return $resultsSchool;
    }

    public function mapAction($editionId)
    {
        $em = $this->getDoctrine()->getManager();   
        $repositoryTeam = $em->getRepository('PouceTeamBundle:Team');
        $repositoryResult = $em->getRepository('PouceTeamBundle:Result');

        $resultArray = $repositoryResult->getAllResultsInEdition($editionId);

        return $this->render('PouceSiteBundle:Map:map.html.twig', array(
                'results' => $resultArray
            ));
    }

    public function mapRecapByYearAction($year)
    {
        $em = $this->getDoctrine()->getManager();   
        $repositoryTeam = $em->getRepository('PouceTeamBundle:Team');
        $repositoryResult = $em->getRepository('PouceTeamBundle:Result');

        $resultArray = $repositoryResult->getAllResultsByYear($year);

        return $this->render('PouceSiteBundle:Map:mapWithTraces.html.twig', array(
                'results' => $resultArray
            ));
    }
}
