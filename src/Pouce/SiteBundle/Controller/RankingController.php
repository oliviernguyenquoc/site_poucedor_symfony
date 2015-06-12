<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Pouce\TeamBundle\Entity\TeamRepository;
use Pouce\SiteBundle\Entity\EditionRepository;

class RankingController extends Controller
{
    public function rankingAction($idEdition)
    {
        $teams=getAllTeamsInEdition($idEdition);
        return $this->render('PouceSiteBundle:Site:ranking.html.twig', array(
          'teams' => $teams,
        ));
    }

    //Recalcule toutes les rangs et stock les nouvelles valeurs dans la base de données 
    private function rankingCalculus($teams){
        $rang=0;
        $rangAdd=0;
        $ancienneDistance=0;
        while($team)
        {
            if($team->getDistance()!=$ancienneDistance)
            {
                $rang+=1;
                $rang+=$rangAdd;
                $rangAdd=0;
            }
            else
            {
                $rangAdd+=1;
            }
            $ancienneDistance=$team->getDistance();
            }

    }
}
