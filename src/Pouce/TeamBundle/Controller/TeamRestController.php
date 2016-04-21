<?php

namespace Pouce\TeamBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;

use Nelmio\ApiDocBundle\Annotation\ApiDoc;

class TeamRestController extends Controller
{
	/**
	 * @ApiDoc(
	 *   resource = true,
	 *   description = "Get informations on a team with the id",
	 * )
	 */
	public function getTeamAction($id){
		$team = $this->getDoctrine()->getRepository('PouceTeamBundle:Team')->findOneBy(array('id' => $id));
		if(!is_object($team)){
			throw $this->createNotFoundException();
		}
		$users = $team->getUsers();

		$userId1 = $users->get(0)->getId();
		$userId2 = $users->get(1)->getId();

		$user1 = $this->forward('PouceUserBundle:UserRest:getUser', array('id' => $userId1), array('_format' => 'json'));
		$user2 = $this->forward('PouceUserBundle:UserRest:getUser', array('id' => $userId2), array('_format' => 'json'));

		return array(
			'user 1' 	=> json_decode($user1->getContent(), true),
			'user 2' 	=> json_decode($user2->getContent(), true),
			'name'		=> $team->getTeamName(),
			'edition'	=> array(
				'date'	=> $team->getEdition()->getDateOfEvent()
			)
		);
	}
}
