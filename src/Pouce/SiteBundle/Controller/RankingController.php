<?php

namespace Pouce\SiteBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Pouce\TeamBundle\Entity\TeamRepository;
use Pouce\SiteBundle\Entity\EditionRepository;

class RankingController extends Controller
{
    //Show the "normal" ranking
    public function showRanking()
    {
        $team=getAllTeamsInEdition(getLastIdEdition());
        return $this->render('PouceSiteBundle:Site:ranking.html.twig', array(
          'team' => $team,
        ));
    }
}
